#!/usr/bin/env python3
"""
Automatically convert old createMarket calls to new struct format
"""
import re
import sys

def convert_create_market_call(match):
    """Convert a createMarket call to use struct syntax"""
    indent = match.group(1)
    title = match.group(2)
    
    # Build struct initialization
    struct_code = f'''{indent}MarketFactory.CreateMarketParams memory params = MarketFactory.CreateMarketParams({{
{indent}    title: {title},
{indent}    description: "Test market description",
{indent}    category: "Test",
{indent}    imageUrl: "",
{indent}    outcomes: outcomes,
{indent}    tradingEndsAt: tradingEndsAt,
{indent}    liquidityParameter: 0,
{indent}    protocolFeeBps: 0,
{indent}    creatorFeeBps: 0,
{indent}    oracleFeeBps: 0,
{indent}    initialLiquidity: initialLiquidity,
{indent}    delphAIMarketId: 1
{indent}}});
{indent}factory.createMarket(params);'''
    
    return struct_code

def process_file(filename):
    """Process a Solidity file and convert createMarket calls"""
    with open(filename, 'r') as f:
        content = f.read()
    
    # Pattern for simple createMarket calls
    # This is a simplified version - you'd need to handle multi-line calls
    pattern = r'(\s+)factory\.createMarket\(\s*("[^"]*"),\s*outcomes,.*?\);'
    
    modified = re.sub(pattern, convert_create_market_call, content, flags=re.DOTALL)
    
    with open(filename, 'w') as f:
        f.write(modified)
    
    print(f"Processed {filename}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 convert_create_market.py <file.sol>")
        sys.exit(1)
    
    for filename in sys.argv[1:]:
        process_file(filename)
