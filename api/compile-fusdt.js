import solc from 'solc';

const source = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FlashUSDTLab {
    string public constant name = "FlashUSDT Lab";
    string public constant symbol = "fUSDT";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    uint256 public immutable expiresAt;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        expiresAt = block.timestamp + 7 days;
        totalSupply = 100_000 * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    modifier activeTransfers() {
        require(block.timestamp <= expiresAt, "Lab token expired");
        _;
    }

    function transfer(address to, uint256 value) external activeTransfers returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external activeTransfers returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "Allowance exceeded");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        _transfer(from, to, value);
        return true;
    }

    function burn(uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Balance too low");
        balanceOf[msg.sender] -= value;
        totalSupply -= value;
        emit Transfer(msg.sender, address(0), value);
        return true;
    }

    function timeRemaining() external view returns (uint256) {
        return block.timestamp >= expiresAt ? 0 : expiresAt - block.timestamp;
    }

    function isExpired() external view returns (bool) {
        return block.timestamp > expiresAt;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "Zero address");
        require(balanceOf[from] >= value, "Balance too low");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
`;

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const input = {
    language: 'Solidity',
    sources: {
      'FlashUSDTLab.sol': { content: source }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((e) => e.severity === 'error');
  if (errors.length) {
    return res.status(500).json({ error: 'Compilation failed', details: errors.map((e) => e.formattedMessage) });
  }

  const contract = output.contracts['FlashUSDTLab.sol']['FlashUSDTLab'];
  return res.status(200).json({
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    token: {
      name: 'FlashUSDT Lab',
      symbol: 'fUSDT',
      decimals: 6,
      supply: '100000',
      network: 'BNB Smart Chain Testnet',
      chainId: 97,
      expiryDays: 7,
      realValue: '$0'
    }
  });
}
