export function isContractMode(): boolean {
  return process.env.TEST_MODE === "contract";
}

