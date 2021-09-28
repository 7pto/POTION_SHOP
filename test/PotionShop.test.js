const assert = require('assert');
const { pathToFileURL } = require('url');

const potion_shop = artifacts.require('PotionShop');



contract('PotionShop', async (accounts) => {
    let potion_contract;

    /**
     *  Functions to interact with the contract
     */
    const priceToPay = (tokensToMint) => 
        0.04 * tokensToMint;

    const activatePresale = async (ownerAccountNum) => 
        await potion_contract.setPresaleActive('true', {from: accounts[ownerAccountNum]}); 

    const activateSale = async (ownerAccountNum) => 
        await potion_contract.setSaleActive('true', {from: accounts[ownerAccountNum]}); 

    const reserveForAccount = async (accountsReserved, ownerAccountNum) => 
        await potion_contract.editPresaleReserved(accountsReserved, {from: accounts[ownerAccountNum]});

    const mintPresale = async (accountNum, amount) => 
        await potion_contract.mintPresale((amount).toString(),
            {from: accounts[accountNum], value: String(web3.utils.toWei(priceToPay(amount).toString(), 'ether'))});

    const mint = async (accountNum, amount) =>
        await potion_contract.mintToken((amount).toString(),
            {from: accounts[accountNum], value: String(web3.utils.toWei(priceToPay(amount).toString(), 'ether'))});

    const balanceInEth = (balance) =>
        parseFloat(web3.utils.fromWei(balance, 'ether'));

    /**
     * This is try catch function for testing the Exceptions in the Contract tests
     */
    const tryCatch = async(promise, message) => {
        // const PREFIX = "VM Exception while processing transaction: ";
        try {
            await promise;
            throw null;
        }
        catch (error) {
            assert(error, "Expected an error but did not get one");
            assert(error.message.includes(message), "Expected an error containing '" + message + "' but got '" + error.message + "' instead");
        }
    };

    /**
     * This catches the Revert exceptions from the contract
     * @param promise 
     */
    const catchRevert = async (promise, msg) => {
        await tryCatch(promise, msg);
    };


            
    beforeEach(async () => {
        potion_contract = await potion_shop.new("ipfs://test/");
        // this tests editPresaleReserved
        await reserveForAccount([accounts[1], accounts[2], accounts[3]], 0);
        
    });


    /* testing presale minting */
    xit('checks for valid amount of presale reserved', async () => {
        const reserved = await potion_contract.presaleReserved(accounts[1]);
        assert.strictEqual(reserved.toString(), '2');
    });

    xit('ensures no one can mint more than reserved', async () => {
        await activatePresale(0);
        
        await mintPresale(2, 1);
        await mintPresale(3, 2);
        await catchRevert(mintPresale(1, 3), "Can't mint more than reserved")
    });

    xit("does not mint if presale not active", async () => {   
        await catchRevert(mintPresale(1, 2), "Presale isn't active");
    });

    xit("does not mint for non reserved addresses", async () => {
        await activatePresale(0);
        await catchRevert(mintPresale(5, 1), "No tokens reserved for your address");
    });

    xit("does not mint after maximum supply reached", async () => {
        // For this test case we have edited the MAX_SUPPLY to 5
        await activatePresale(0);
        await mintPresale(1, 2);
        await mintPresale(2, 2);
        await mintPresale(3, 1);
        await catchRevert(mintPresale(3, 1),"Can't mint more than max supply");
    });

    xit("does not mint with wrong amount", async () => {
        await activatePresale(0);
        await catchRevert(
            potion_contract.mintPresale(
                '2', 
                { from: accounts[1], value: String(web3.utils.toWei(priceToPay(3).toString(), 'ether')) }
            ),
            "Wrong amount of ETH sent"
        );
    });
    /*presale minting tests end */


    /*sale minting tests */
    xit("does not mint if sale not active", async () => {
        await catchRevert(mint(5, 1), "Sale isn't active");
    });

    xit("cannot mint more than 20 in one tx", async () => {
        await activateSale(0);
        await catchRevert(mint(1, 21), "Can only mint between 1 and 20 tokens at once");
    });

    xit("cannot mint more than MAX_SUPPLY in one tx", async () => {
        // For this test case we have edited the MAX_SUPPLY to 5
        await activateSale(0);
        await mint(1, 3);
        await catchRevert(mint(2, 3), "Can't mint more than max supply");
    });

    xit("does not mint with wrong amount", async () => {
        await activateSale(0);
        await catchRevert(
            potion_contract.mintToken(
                '3',
                { from: accounts[1], value: String(web3.utils.toWei(priceToPay(2).toString(), 'ether')) }
            ), 
            "Wrong amount of ETH sent"
        );
    });
    /*sale minting tests end */


    /*test every onlyOwner function for ensuring no one else can call it */
    xit("does not allow others to edit presale reserved list", async () => {
        await catchRevert(reserveForAccount([accounts[5]], 2), "Ownable: caller is not the owner");
    });

    xit("does not allow others to toggle activatePresale", async () => {
        await catchRevert(activatePresale(5), "Ownable: caller is not the owner");
    });

    xit("does not allow others to toggle activatesale", async () => {
        await catchRevert(activateSale(5), "Ownable: caller is not the owner");
    });

    xit("does not allow others to edit base uri", async () => {
        await catchRevert(
            potion_contract.setBaseURI("ipfs://lorem", {from: accounts[5]}), 
            "Ownable: caller is not the owner"
        );
    });

    xit("does not allow others to edit price", async () => {
        await catchRevert(
            potion_contract.setPrice("10", {from: accounts[5]}), 
            "Ownable: caller is not the owner"
        );
    });

    xit("does not allow others to edit withdrawal address", async () => {
        await catchRevert(
            potion_contract.setAddress(accounts[5], {from: accounts[5]}), 
            "Ownable: caller is not the owner"
        );
    });

    xit("does not allow others to withdraw", async () => {
        await catchRevert(
            potion_contract.withdraw({from: accounts[5]}), 
            "Ownable: caller is not the owner"
        );
    });

    xit("transfer ownership to someone", async () => {
        await potion_contract.transferOwnership(accounts[1], { from: accounts[0] });
        await catchRevert(activatePresale(0), "Ownable: caller is not the owner");
        await activatePresale(1);
    })
    /* ending onlyOwner tests */

    /*testing every function works correctly*/
    xit("tests tokensOfOwner function also mintPresale function", async () =>{
        await activatePresale(0);
        await mintPresale(2, 1);
        await mintPresale(3, 1);
        await mintPresale(2, 1);
        await mintPresale(3, 1);

        let [a, b] = await potion_contract.tokensOfOwner(accounts[2], {from: accounts[5]});
        let [c, d] = await potion_contract.tokensOfOwner(accounts[3], {from: accounts[5]});
        a = a.toNumber();
        b = b.toNumber();
        c = c.toNumber();
        d = d.toNumber();
        assert.strictEqual(a, 0);
        assert.strictEqual(b, 2);
        assert.strictEqual(c, 1);
        assert.strictEqual(d, 3);
    }); 

    xit("tests mintToken function", async () => {
        // change MAX_SUPPLY to 30 for this test case
        await activateSale(0);

        await mint(2, 5);
        await mint(3, 5);
        await mint(2, 5);
        await mint(3, 15);
        
        let tokensOfAccount2 = await potion_contract.tokensOfOwner(accounts[2], {from: accounts[5]});
        let tokensOfAccount3 = await potion_contract.tokensOfOwner(accounts[3], {from: accounts[5]});
        
        assert.strictEqual(tokensOfAccount2.length, 10);
        assert.strictEqual(tokensOfAccount3.length, 20);
        
    });
    
    it("Tests tokenURI function", async () => {
        await activateSale(0);
        await mint(1, 3);
        
        const tokenUri0 = await potion_contract.tokenURI('0');
        const tokenUri1 = await potion_contract.tokenURI('1');
        const tokenUri2 = await potion_contract.tokenURI('2');
        
        assert.strictEqual(tokenUri0, "ipfs://test/0.json");
        assert.strictEqual(tokenUri1, "ipfs://test/1.json");
        assert.strictEqual(tokenUri2, "ipfs://test/2.json");
        await catchRevert(potion_contract.tokenURI('3'), "ERC721Metadata: URI query for nonexistent token");
        
    }); 
    
    it("tests setBaseURI function", async () => {
        await potion_contract.setBaseURI('ipfs://newURI/', {from: accounts[0]});
        await activateSale(0);
        await mint(3,4);
        
        const tokenUri0 = await potion_contract.tokenURI('0');
        
        assert.strictEqual(tokenUri0, "ipfs://newURI/0.json");
    });
    
    it("tests setPrice function", async () => {
        await potion_contract.setPrice(String(web3.utils.toWei("0.08", 'ether')), {from: accounts[0]});

        assert.strictEqual(balanceInEth(await potion_contract.price()), 0.08);
    });
    
    it("tests setAddress function", async () => {
        await potion_contract.setAddress((accounts[5]).toString(), {from: accounts[0]});
        
        let withdrawalAddress = await potion_contract.a1();
        
        assert.strictEqual(withdrawalAddress, accounts[5].toString());
    }); 
    it("tests withdraw function", async () => {
        // not purely equal but equal if rounded to almost 14 decimal places
        await potion_contract.setAddress((accounts[5]).toString(), {from: accounts[0]});
        await activateSale(0);
        await mint(2, 5);

        BalanceBeforeWithdraw = balanceInEth(await web3.eth.getBalance(accounts[5]));
        await potion_contract.withdraw();
        BalanceAfterWithdraw = balanceInEth(await web3.eth.getBalance(accounts[5]));

        assert.strictEqual(parseFloat(BalanceAfterWithdraw-BalanceBeforeWithdraw).toFixed(14),
         parseFloat(priceToPay(5)).toFixed(14));
    }); 
    /*every function works correctly*/
    
});


// it("", async () =>{}); 