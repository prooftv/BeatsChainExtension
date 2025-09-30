#!/usr/bin/env node

// Test if contract exists on Mumbai testnet
async function testContractExists() {
    const contractAddress = '0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B';
    const rpcUrl = 'https://rpc-mumbai.maticvigil.com/';
    
    try {
        console.log('🔍 Testing contract existence...');
        console.log('Contract:', contractAddress);
        console.log('Network: Mumbai Testnet');
        
        // Check if address has code (is a contract)
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getCode',
                params: [contractAddress, 'latest'],
                id: 1
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            console.error('❌ RPC Error:', result.error);
            return false;
        }
        
        const code = result.result;
        
        if (code === '0x' || code === '0x0') {
            console.log('❌ NO CONTRACT FOUND');
            console.log('   Address has no bytecode - contract not deployed');
            return false;
        } else {
            console.log('✅ CONTRACT EXISTS');
            console.log('   Bytecode length:', code.length);
            console.log('   First 50 chars:', code.substring(0, 50) + '...');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return false;
    }
}

// Run the test
testContractExists().then(exists => {
    if (!exists) {
        console.log('\n🚨 CRITICAL: Contract needs to be deployed!');
        console.log('   Current address is placeholder/fake');
        console.log('   Extension will not work without real contract');
    } else {
        console.log('\n✅ Contract verified - extension ready!');
    }
    process.exit(exists ? 0 : 1);
});