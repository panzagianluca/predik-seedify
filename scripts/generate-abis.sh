#!/bin/bash

# Generate TypeScript ABI files from compiled Solidity contracts
# Run this after deploying new contracts to keep ABIs in sync

set -e

CONTRACTS=(
  "LMSRMarket"
  "MarketFactory"
  "MockUSDT"
  "Oracle"
  "Outcome1155"
  "Router"
  "Treasury"
)

echo "🔧 Generating TypeScript ABIs from compiled contracts..."

for contract in "${CONTRACTS[@]}"; do
  echo "📄 Processing ${contract}..."
  
  # Extract ABI from compiled JSON
  abi=$(cat "out/${contract}.sol/${contract}.json" | jq -c '.abi')
  
  # Create TypeScript file with uppercase contract name for constant
  contract_upper=$(echo "${contract}" | tr '[:lower:]' '[:upper:]')
  
  cat > "lib/abis/${contract}.ts" << EOF
// Auto-generated ABI for ${contract}
// Generated on: $(date)
// DO NOT EDIT MANUALLY - run './scripts/generate-abis.sh' instead

export const ${contract_upper}_ABI = ${abi} as const;
EOF
  
  echo "✅ Generated lib/abis/${contract}.ts"
done

echo ""
echo "🎉 All ABIs generated successfully!"
echo "📝 Updated files:"
for contract in "${CONTRACTS[@]}"; do
  echo "  - lib/abis/${contract}.ts"
done
