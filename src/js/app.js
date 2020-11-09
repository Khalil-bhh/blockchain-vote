App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',

    init: function () {
        return App.initWeb3();
    },
    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
            console.log("web3 === undefined")
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Election.json", function (election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
            console.log("contract init");
            return App.render();
        });
    },
    render: function () {
        var electionInstance;
        var loader = $("#loader");
        var votelist = $(".voting-list");
        var voteresult = $(".voting-result");
        loader.show();
        votelist.show();
        voteresult.show();
        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your Account: " + account);
            }
        });
        // Load contract data
        App.contracts.Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidatesCount();
        }).then(function (candidatesCount) {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();
            var candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();
            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then(function (candidate) {
                    console.log(candidate)
                    var avatar = candidate [2];
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[3];
                    electionInstance.totalVotes().then(function (total) {
                      let percentage =(total==0)?0:voteCount / total * 100;

                      var candidateTemplate = "<tr><td>" + avatar + "</td><td>" + id + "</td><td>" + name +
                          "</td><td>" + percentage + " %" + "</td></tr>";
                      candidatesResults.append(candidateTemplate);
                      // Render candidate ballot option
                      var candidateOption = '<div class="form-check">'+
                        '<input class="form-check-input" type="radio" name="vote"  id="'+id+'"value="' + id + '">'+
                        '<label class="form-check-label" for="'+id+'">'+name +' </label> </div>';
                      candidatesSelect.append(candidateOption);
                    })
                });
            }
            return electionInstance.voters(App.account);
        }).then(function (hasVoted) {
            // Do not allow a user to vote
            var votingList =$('.voting-list');
            var votingResult = $('.voting-result');
            if (hasVoted) {
                votingList.hide();
                votingResult.show();
            }else {
                votingList.show();
                votingResult.hide();
            }
            loader.hide();

        }).catch(function (error) {
            console.warn(error);
        });
    }
    ,
    castVote: function () {
        var candidateId = $('input[name="vote"]:checked').val();
        App.contracts.Election.deployed().then(function (instance) {
            return instance.vote(candidateId, {from: App.account});
        }).then(function (result) {
            // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function (err) {
            console.error(err);
        });
    },
    listenForEvents: function () {
        App.contracts.Election.deployed().then(function (instance) {
            instance.votedEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                console.log("event triggered", event);
                // Reload when a new vote is recorded
                App.render();
            });
        });
    },
    initContract: function () {
        $.getJSON("Election.json", function (election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);

            App.listenForEvents();

            return App.render();
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
