export const failwithContractCode = [{ "prim": "parameter", "args": [{ "prim": "unit" }] },
{ "prim": "storage", "args": [{ "prim": "unit" }] },
{
  "prim": "code",
  "args":
    [[{
      "prim": "PUSH",
      "args":
        [{ "prim": "string" },
        { "string": "test" }]
    },
    { "prim": "FAILWITH" }]]
}]
