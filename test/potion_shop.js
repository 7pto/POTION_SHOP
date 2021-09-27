const assert = require('assert');

const potion_shop = artifacts.require('potion_shop');



contract('potion_shop', (accounts) => {
    let potion_shop_address;
    let potion_contract;

    function priceToPay(tokensToMint) {
        return 0.04 * tokensToMint;
    }

    async function activatePresale(ownerAccountNum) {
        await potion_contract.setPresaleActive('true', {from: accounts[ownerAccountNum]}); 
    }

    async function activateSale(ownerAccountNum) {
        await potion_contract.setSaleActive('true', {from: accounts[ownerAccountNum]}); 
    }

    async function reserveForAccount(accountNum, amount, ownerAccountNum) {
        await potion_contract.editPresaleReserved([accounts[accountNum]], [amount], {from: accounts[ownerAccountNum]});
    }

    async function mintPresale(accountNum, amount) {
        await potion_contract.mintPresale((amount).toString(),
            {from: accounts[accountNum], value: String(web3.utils.toWei(priceToPay(amount).toString(), 'ether'))});
    }

    async function mint(accountNum, amount) {
        await potion_contract.mintToken((amount).toString(),
            {from: accounts[accountNum], value: String(web3.utils.toWei(priceToPay(amount).toString(), 'ether'))});
    }

    beforeEach(async () => {
        potion_contract = await potion_shop.new("ipfs://test");
        await reserveForAccount(1, 2, 0);
        
    });

    /* testing presale minting */
    it('checks for valid amount of presale reserved', async () => {
        var reserved = await potion_contract.presaleReserved(accounts[1]);
        assert.strictEqual(reserved.toString(), '2');
    });
    it('ensures no one can mint more than reserved', async () => {
        await activatePresale(0);
        
        try {
            await mintPresale(1, 3);
            assert(false);  
        } catch (error) {
            assert(error);
        }
    });
    it("does not mint if presale not active", async () => {   

        try {
            await mintPresale(1, 2);
            assert(false);  
        } catch (error) {
            assert(error);
        }
    });
    it("does not mint for non reserved addresses", async () => {
        await activatePresale(0);

        try {
            await mintPresale(2, 1);
            assert(false);  
        } catch (error) {
            assert(error);
        }
        
    });

    // xit("does not mint after maximum supply reached", async () => {
    //     activatePresale();

    // });

    it("does not mint with wrong amount", async () => {
        await activatePresale(0);
        try {
            await potion_contract.mintPresale((2).toString(),
                {from: accounts[1], value: String(web3.utils.toWei(priceToPay(3).toString(), 'ether'))});
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    /*presale minting tests end */

    /*sale minting tests */
    it("does not mint if sale not active", async () => {
        try {
            await mint(5);
            assert(false);
            
        } catch (error) {
            assert(error);
        }

    });

    it("cannot mint more than 20 in one tx", async () => {
        await activateSale(0);

        try {
            await mint(1, 21);
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    // it("cannot mint after maximum supply reached", async () => {

    // });

    it("does not mint with wrong amount", async () => {
        await activateSale(0);
        try {
            await potion_contract.mintToken((3).toString(),
                {from: accounts[1], value: String(web3.utils.toWei(priceToPay(2).toString(), 'ether'))});
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    /*sale minting tests end */

    /*test every onlyOwner function for ensuring no one else can call it */
    it("does not allow others to edit presale reserved list", async () => {

        try {
            await reserveForAccount(5, 2, 2);
            assert(false);
        } catch (error) {
            assert(error);
        }
    });
    it("does not allow others to toggle activatePresale", async () => {

        try {
            await activatePresale(5);
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it("does not allow others to toggle activatesale", async () => {

        try {
            await activateSale(5);
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it("does not allow others to edit base uri", async () => {

        try {
            await potion_contract.setBaseURI("ipfs://lorem", {from: accounts[5]});
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it("does not allow others to edit price", async () => {

        try {
            await potion_contract.setPrice("10", {from: accounts[5]});
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it("does not allow others to edit withdrawal address", async () => {

        try {
            await potion_contract.setAddress(accounts[5], {from: accounts[5]});
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it("does not allow others to withdraw", async () => {

        try {
            await potion_contract.withdraw({from: accounts[5]});
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    
    /*uri testing */
});


/*template for testing:

    it("", async () => {});

    try {

            assert(false);
        } catch (error) {
            assert(error);
        }
*/