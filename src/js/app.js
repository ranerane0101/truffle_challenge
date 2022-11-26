//App というJSON を記述しています
App = {
  web3Provider: null,
  contracts: {},

  //このJSON メソッドではpets.json のデータをHTML に送ります
  init: async function() {
    // index.html の54行目でインポートしているJQuery を使って16匹のペットの情報を持ってるpets.json からJSON を取得し変数data に代入しています
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  //このJSON メソッドでは、非同期処理を使ってWeb 3.js からインスタンスを初期化します
  initWeb3: async function() {
      //もし、イーサリアムノードにweb 3インスタンスすでにあれば、そっちを使う
      if (typeof web3 !== 'undefined') {
          　App.web3Provider = web3.currentProvider;
      } else {
          　//localhost:9545 にあるコントラクトを呼び出す
          　App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }
      //3行目にあるweb3Provider を呼び出しWeb 3インスタンスを生成する
      web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  //コントラクトをJavaScript で扱えるようをインスタンス化します
  initContract: function() {
      $.getJSON('Adoption.json', function(data) {
          　console.log("Adoption.json は、" + JSON.stringify(data));
          　var AdoptionArtifact = data;
          　//truffle-contract.js (ライブラリ)を使いコントラクトをJavaScript で扱えるように変換
          　App.contracts.Adoption = TruffleContract(AdoptionArtifact);
          　console.log('App.contracts.Adoption は、' + App.contracts.Adoption)
            //35行目で呼び出したコントラクトをプロパイダー(Metamask)に投げます。
          　App.contracts.Adoption.setProvider(App.web3Provider);
          　//63行目から始まるmarkAdopted を実行
          　return App.markAdopted();
      });
    //59行目から始めるbindEvents を実行
    return App.bindEvents();
  },

  bindEvents: function() {
    //Adopt ボタンを押すと86行目のhandleAdopt のJSON メソッドを実行
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  //ペットたちの購入状況を取得し、購入済みだったらボタンをSuccess に変更する
  markAdopted: function() {
      var adoptionInstance;
      App.contracts.Adoption.deployed().then(function(instance) {
          　adoptionInstance = instance;
            //call メソッドを使用してコントラクトから変数を取り出すことができgas 代をかけずに取り出すことができる
          　return adoptionInstance.getAdopters.call();
      }).then(function(adopters) {
          　for (i = 0; i < adopters.length; i++) {
                 //もしすでにこのペットが購入済みだったら
              　　if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
                    　　//JQuery を使ってSuccess と表示させる
                  　　　$('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
              　　}
          　}
      }).catch(function(err) {
          　console.log(err.message);
      });
  },

  //
  handleAdopt: function(event) {
    console.dir(event);
    //JavaScript のpreventDefault メソッドを使って の処理を禁止します
    event.preventDefault();

    //JQuery を使ってindex.html の47行目のdata-id 属性の文字列を取得し整数に変換しpetId に代入
    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;
    web3.eth.getAccounts(function(error, accounts) {
        　if (error) {
            　　console.log(error);
        　}
        　var account = accounts[0];
        　App.contracts.Adoption.deployed().then(function(instance) {
            　　adoptionInstance = instance;
            　　return adoptionInstance.adopt(petId, {from: account});
        　}).then(function(result) {
            　　return App.markAdopted();
        　}).catch(function(err) {
            　　console.log(err.message);
        　});
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});