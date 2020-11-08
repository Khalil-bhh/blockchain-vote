pragma solidity ^0.5.0;

contract Election{

    struct Candidate {
        uint id;
        string name;
        string avatar;
        uint voteCount;
    }
    mapping(uint => Candidate) public candidates;
    mapping( address => bool) public voters;
    uint public candidatesCount;
    uint public totalVotes;

    event votedEvent (
        uint indexed _candidateId
    );

    constructor() public{
        addCandidate("Chayma","url1");
        addCandidate("Wassim","url2");
        addCandidate("Oumayma","url3");
        addCandidate("Amine","url4");
        totalVotes=0;

    }


    function addCandidate (string memory _name, string memory _url) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _url, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);
        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);
        // record that voter has voted
        voters[msg.sender] = true;
        // update candidate vote Count
        candidates[_candidateId].voteCount ++;
        totalVotes++;

        emit votedEvent(_candidateId);
    }
}
