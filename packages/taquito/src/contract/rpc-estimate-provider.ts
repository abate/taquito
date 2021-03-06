import {
  OperationResultDelegation,
  OperationResultOrigination,
  OperationResultTransaction,
  PreapplyResponse,
  RPCRunOperationParam,
} from '@taquito/rpc';
import { DEFAULT_GAS_LIMIT, DEFAULT_STORAGE_LIMIT } from '../constants';
import { OperationEmitter } from '../operations/operation-emitter';
import {
  DelegateParams,
  OriginateParams,
  PrepareOperationParams,
  RegisterDelegateParams,
  TransferParams,
} from '../operations/types';
import { Estimate } from './estimate';
import { EstimationProvider } from './interface';
import {
  createOriginationOperation,
  createRegisterDelegateOperation,
  createSetDelegateOperation,
  createTransferOperation,
} from './prepare';
import { flattenErrors, TezosOperationError } from '../operations/operation-errors';

// RPC require a signature but do not verify it
const SIGNATURE_STUB =
  'edsigtkpiSSschcaCt9pUVrpNPf7TTcgvgDEDD6NCEHMy8NNQJCGnMfLZzYoQj74yLjo9wx6MPVV29CvVzgi7qEcEUok3k7AuMg';

export class RPCEstimateProvider extends OperationEmitter implements EstimationProvider {
  // Maximum values defined by the protocol
  private async getConstants() {
    const {
      hard_gas_limit_per_operation,
      hard_storage_limit_per_operation,
    } = await this.rpc.getConstants();
    return {
      fee: 30000,
      gasLimit: hard_gas_limit_per_operation.toNumber(),
      storageLimit: hard_storage_limit_per_operation.toNumber(),
    };
  }

  private getOperationResult(
    opResponse: PreapplyResponse,
    kind: 'origination' | 'transaction' | 'delegation'
  ): (OperationResultTransaction | OperationResultOrigination | OperationResultDelegation)[] {
    const results = opResponse.contents;
    const originationOp = Array.isArray(results) && results.find(op => op.kind === kind);
    const opResult =
      originationOp && originationOp.metadata && originationOp.metadata.operation_result;
    const internalResult =
      originationOp && originationOp.metadata && originationOp.metadata.internal_operation_results;
    return [opResult, ...(internalResult || []).map(({ result }: any) => result)].filter(
      (x: any) => !!x
    );
  }

  private async createEstimate(
    params: PrepareOperationParams,
    kind: 'origination' | 'transaction' | 'delegation',
    defaultStorage: number,
    minimumGas: number = 0
  ) {
    const {
      opbytes,
      opOb: { branch, contents },
    } = await this.prepareAndForge(params);

    let operation: RPCRunOperationParam = {
      operation: { branch, contents, signature: SIGNATURE_STUB },
      chain_id: await this.rpc.getChainId(),
    };

    const { opResponse } = await this.simulate(operation);

    const errors = flattenErrors(opResponse);

    // Fail early in case of errors
    if (errors.length) {
      throw new TezosOperationError(errors);
    }

    const operationResults = this.getOperationResult(opResponse, kind);

    let totalGas = 0;
    let totalStorage = 0;
    operationResults.forEach(result => {
      totalGas += Number(result.consumed_gas) || 0;
      totalStorage +=
        'paid_storage_size_diff' in result ? Number(result.paid_storage_size_diff) || 0 : 0;
    });

    return new Estimate(
      Math.max(totalGas || 0, minimumGas),
      Number(totalStorage || 0) + defaultStorage,
      opbytes.length / 2
    );
  }

  /**
   *
   * @description Estimate gasLimit, storageLimit and fees for an origination operation
   *
   * @returns An estimation of gasLimit, storageLimit and fees for the operation
   *
   * @param OriginationOperation Originate operation parameter
   */
  async originate({ fee, storageLimit, gasLimit, ...rest }: OriginateParams) {
    const pkh = await this.signer.publicKeyHash();
    const DEFAULT_PARAMS = await this.getConstants();
    const op = await createOriginationOperation({
      ...rest,
      ...DEFAULT_PARAMS,
    });
    return this.createEstimate(
      { operation: op, source: pkh },
      'origination',
      DEFAULT_STORAGE_LIMIT.ORIGINATION
    );
  }
  /**
   *
   * @description Estimate gasLimit, storageLimit and fees for an transfer operation
   *
   * @returns An estimation of gasLimit, storageLimit and fees for the operation
   *
   * @param TransferOperation Originate operation parameter
   */
  async transfer({ fee, storageLimit, gasLimit, ...rest }: TransferParams) {
    const pkh = await this.signer.publicKeyHash();
    const DEFAULT_PARAMS = await this.getConstants();
    const op = await createTransferOperation({
      ...rest,
      ...DEFAULT_PARAMS,
    });
    return this.createEstimate(
      { operation: op, source: pkh },
      'transaction',
      DEFAULT_STORAGE_LIMIT.TRANSFER
    );
  }

  /**
   *
   * @description Estimate gasLimit, storageLimit and fees for a delegate operation
   *
   * @returns An estimation of gasLimit, storageLimit and fees for the operation
   *
   * @param Estimate
   */
  async setDelegate(params: DelegateParams) {
    const DEFAULT_PARAMS = await this.getConstants();
    const op = await createSetDelegateOperation({ ...params, ...DEFAULT_PARAMS });
    const sourceOrDefault = params.source || (await this.signer.publicKeyHash());
    return this.createEstimate(
      { operation: op, source: sourceOrDefault },
      'delegation',
      DEFAULT_STORAGE_LIMIT.DELEGATION,
      // Delegation have a minimum gas cost
      DEFAULT_GAS_LIMIT.DELEGATION
    );
  }

  /**
   *
   * @description Estimate gasLimit, storageLimit and fees for a delegate operation
   *
   * @returns An estimation of gasLimit, storageLimit and fees for the operation
   *
   * @param Estimate
   */
  async registerDelegate(params: RegisterDelegateParams) {
    const DEFAULT_PARAMS = await this.getConstants();
    const op = await createRegisterDelegateOperation(
      { ...params, ...DEFAULT_PARAMS },
      await this.signer.publicKeyHash()
    );
    return this.createEstimate(
      { operation: op, source: await this.signer.publicKeyHash() },
      'delegation',
      DEFAULT_STORAGE_LIMIT.DELEGATION,
      // Delegation have a minimum gas cost
      DEFAULT_GAS_LIMIT.DELEGATION
    );
  }
}
