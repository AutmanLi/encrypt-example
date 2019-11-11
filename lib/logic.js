/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * uploadFile
 * @param {fileacl.uploadFile} uploadFile
 * @transaction
 */
async function uploadFile(tx) {
  
  	const factory = getFactory();
  	const namespace = 'fileacl';
  	const new_file_info=factory.newResource(namespace, 'fileInfo', tx.file_hash);
    new_file_info.file_name=tx.file_name;
  	new_file_info.ciper_text=tx.ciper_text;
  	new_file_info.owner=tx.userID;
  
  	// 保存新的加密文件信息上链
    const encrypt_file_info = await getAssetRegistry(new_file_info.getFullyQualifiedType());
    await encrypt_file_info.add(new_file_info);
  
    const new_file_profile=factory.newResource(namespace, 'fileACL', tx.file_hash);
  	new_file_profile.file_profile=tx.file_profile;
  	new_file_profile.upload_time=new Date();
  
  	// 保存新的加密文件信息上链
    const encrypt_file_profile = await getAssetRegistry(new_file_profile.getFullyQualifiedType());
    await encrypt_file_profile.add(new_file_profile);
}


//全局uri变量
const server_uri = 'http://139.9.200.208:';
const HE_uri = '4000';
const FHE_uri = '5001';

/**
 * transferSchool HE_add_balance 基于HE的增加余额
 * @param {encrypt.transaction.example.HE_add_balance} tx
 * @transaction
 */
async function HE_add_balance(tx) {
    const factory = getFactory();
    let oldBalance = tx.user.balance;

    //console.log(tx.user.publicKey);
    let newBalance = await HE_Add(tx.user.publicKey, oldBalance, tx.addBalance);
    tx.user.balance = newBalance;

    const consumerRegistry = await getParticipantRegistry('encrypt.transaction.example.consumer_HE');
    await consumerRegistry.update(tx.user);
}

/**
 * transferSchool HE_add_balance 基于HE的增加余额
 * @param {encrypt.transaction.example.transaction_by_HE} tx
 * @transaction
 */
async function transaction_by_HE(tx) {
    const factory = getFactory();
    let oldOwner = tx.com.owner;
    let oldOwner_oldBalance = oldOwner.balance;

    // 先给这个卖方增加余额
    let oldOwner_newBalance = await HE_Add(oldOwner.publicKey, oldOwner_oldBalance, tx.priceForSeller);
    // 再给买方减少余额
    let newOwner_newBalance = await HE_Add(tx.newOwner.publicKey, tx.newOwner.balance, tx.priceForBuyer);

    oldOwner.balance = oldOwner_newBalance;
    tx.newOwner.balance = newOwner_newBalance;

    const consumerRegistry = await getParticipantRegistry('encrypt.transaction.example.consumer_HE');
    await consumerRegistry.update(oldOwner);
    await consumerRegistry.update(tx.newOwner);

    // 修改商品的所有者
    tx.com.owner = tx.newOwner;
    const commdityRegistry = await getAssetRegistry('encrypt.transaction.example.commodity_HE');
    await commdityRegistry.update(tx.com);

}

/**
 * transferSchool FHE_add_balance 基于HE的增加余额
 * @param {encrypt.transaction.example.FHE_add_balance} tx
 * @transaction
 */
async function FHE_add_balance(tx) {
    const factory = getFactory();
    let oldBalance = tx.user.balance;

    let newBalance = await FHE_Add(tx.context, tx.publicKey, oldBalance, tx.addBalance);

    tx.user.balance = newBalance;

    const consumerRegistry = await getParticipantRegistry('encrypt.transaction.example.consumer_FHE');
    await consumerRegistry.update(tx.user);
}

/**
 * transferSchool FHE_sub_balance 基于HE的减少余额
 * @param {encrypt.transaction.example.FHE_sub_balance} tx
 * @transaction
 */
async function FHE_sub_balance(tx) {
    const factory = getFactory();
    let oldBalance = tx.user.balance;

    let newBalance = await FHE_Sub(tx.context, tx.publicKey, oldBalance, tx.subBalance);
    tx.user.balance = newBalance;

    const consumerRegistry = await getParticipantRegistry('encrypt.transaction.example.consumer_FHE');
    await consumerRegistry.update(tx.user);
}

/**
 * transferSchool FHE_mul_balance 基于HE的乘法调用
 * @param {encrypt.transaction.example.FHE_mul_balance} tx
 * @transaction
 */
async function FHE_mul_balance(tx) {
    const factory = getFactory();
    let oldBalance = tx.user.balance;

    let newBalance = await FHE_Mul(tx.context, tx.publicKey, oldBalance, tx.mulBalance);
    tx.user.balance = newBalance;

    const consumerRegistry = await getParticipantRegistry('encrypt.transaction.example.consumer_FHE');
    await consumerRegistry.update(tx.user);
}

/**
 * transferSchool transaction_by_FHE 基于FHE的商品交易
 * @param {encrypt.transaction.example.transaction_by_FHE} tx
 * @transaction
 */
async function transaction_by_FHE(tx) {
    const factory = getFactory();
    let oldOwner = tx.com.owner;
    let oldOwner_oldBalance = oldOwner.balance;

    // 先给这个卖方增加余额
    let oldOwner_newBalance = await FHE_Add(oldOwner.context, oldOwner.publicKey, oldOwner_oldBalance, tx.priceForSeller);
    // 再给买方减少余额
    let newOwner_newBalance = await FHE_Sub(tx.newOwner.context, tx.newOwner.publicKey, tx.newOwner.balance, tx.priceForBuyer);

    oldOwner.balance = oldOwner_newBalance;
    tx.newOwner.balance = newOwner_newBalance;

    const consumerRegistry = await getParticipantRegistry('encrypt.transaction.example.consumer_FHE');
    await consumerRegistry.update(oldOwner);
    await consumerRegistry.update(tx.newOwner);

    // 修改商品的所有者
    tx.com.owner = tx.newOwner;
    const commdityRegistry = await getAssetRegistry('encrypt.transaction.example.consumer_FHE');
    await commdityRegistry.update(tx.com);

}

/**
 * HE 加法 调用rest api接口计算
 * @param {*} pubKey 公钥
 * @param {*} num 被加数
 * @param {*} add_num 加数
 */
async function HE_Add(pubKey, num, add_num) {
    var logindata = { "username": "autman" };
    const login = await request.post({ uri: server_uri + HE_uri + '/users', json: logindata });
    console.log(login)
    var secret = login.secret;
    var token = login.token;
    const formdata = {
        args: [pubKey, num, add_num],
        fcn: "HomoAdd",
        peers: ["a/peer0", "a/peer1"]
    };
    const homeAddRequest = await request.post({ uri: server_uri + HE_uri + '/channels/common/chaincodes/transfer1', auth: { 'bearer': token }, json: formdata });
    const transactionID = homeAddRequest.transaction;
    console.log(transactionID);
    const IDchain = await request.get({ uri: server_uri + HE_uri + '/channels/common/transactions/' + transactionID + '?peer=peer0', auth: { 'bearer': token } });
    console.log(IDchain);
    var startIndex = IDchain.search('Balance') + 12;
    var endIndex = IDchain.search('PublicKey') - 5;

    var newBalance = IDchain.substring(startIndex, endIndex);
    return newBalance;
}



/**
 * FHE 加法
 * @param {*} context FHE上下文
 * @param {*} publicKey 用户公钥
 * @param {*} ctxt1 被加数
 * @param {*} ctxt2 加数
 */
async function FHE_Add(context, publicKey, ctxt1, ctxt2) {
    const formdata = {
        "a": context,
        "b": publicKey,
        "c": ctxt1,
        "d": ctxt2
    };
    const homeAddRequest = await request.post({
        uri: server_uri + FHE_uri + '/fhe/add', json: true, form: formdata, headers: {
            "content-type": "application/json",
        }
    });
    let result = homeAddRequest;
    console.log(result);
    return result;
}

/**
 * FHE 减法
 * @param {*} context FHE上下文
 * @param {*} publicKey 用户公钥
 * @param {*} ctxt1 被减数
 * @param {*} ctxt2 减数
 */
async function FHE_Sub(context, publicKey, ctxt1, ctxt2) {
    const formdata = {
        "a": context,
        "b": publicKey,
        "c": ctxt1,
        "d": ctxt2
    };
    const homeAddRequest = await request.post({
        uri: server_uri + FHE_uri + '/fhe/sub', json: true, form: formdata, headers: {
            "content-type": "application/json",
        }
    });
    let result = homeAddRequest;
    console.log(result);
    return result;
}

/**
 * FHE 乘法
 * @param {*} context FHE上下文
 * @param {*} publicKey 用户公钥
 * @param {*} ctxt1 被乘数
 * @param {*} ctxt2 乘数
 */
async function FHE_Mul(context, publicKey, ctxt1, ctxt2) {
    const formdata = {
        "a": context,
        "b": publicKey,
        "c": ctxt1,
        "d": ctxt2
    };
    const homeAddRequest = await request.post({
        uri: server_uri + FHE_uri + '/fhe/mul', json: true, form: formdata, headers: {
            "content-type": "application/json",
        }
    });
    let result = homeAddRequest;
    console.log(result);
    return result;
}


// 生成一个随机数的方法
function randomString(len) {
    len = len || 12;
    var $chars = '0123456789';
    var maxPos = $chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}
