import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import SocialNetwork from '../abis/SocialNetwork.json'
import Navbar from './Navbar'
import Main from './Main'

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values
const itemsinblock = [];




class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = SocialNetwork.networks[networkId]
    if(networkData) {
      const socialNetwork = web3.eth.Contract(SocialNetwork.abi, networkData.address)
      this.setState({ socialNetwork })
      const postCount = await socialNetwork.methods.postCount().call()
      this.setState({ postCount })
      // Load Posts
      for (var i = 1; i <= postCount; i++) {
        const post = await socialNetwork.methods.posts(i).call()
        this.setState({
          posts: [...this.state.posts, post]
        })
      }
      // Sort posts. Show highest tipped posts first
      this.setState({
        posts: this.state.posts.sort((a,b) => b.tipAmount - a.tipAmount )
      })
      this.setState({ loading: false})
    } else {
      window.alert('SocialNetwork contract not deployed to detected network.')
    }
  }

  createPost(content) {
    this.setState({ loading: true })
    this.state.socialNetwork.methods.createPost(content).send({ from: this.state.account})
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  tipPost(id) {
    this.setState({ loading: true })
    this.state.socialNetwork.methods.tipPost(id).send({ from: this.state.account, value: 1000000000000000000 })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      memeHash: '',
      contract: null,
      buffer: null,
      account: '',
      socialNetwork: null,
      postCount: 0,
      posts: [],
      loading: true
    }

    this.createPost = this.createPost.bind(this)
    this.tipPost = this.tipPost.bind(this)
  }

  captureFile = (event) => {

    console.log("Loading the File.......................")
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
        console.log('Selected File :', this.state.buffer)
    }
  }

  onSubmit = (event) => {
    var flag=0;
    event.preventDefault()
    console.log("Checking  IPFS Hash  in Blockchain.......")   
    ipfs.add(this.state.buffer, (error, result) => {
      const memeHash=result[0].hash
      console.log('Ipfs value of this file : ',memeHash)       
      for(var i=0;i<=itemsinblock.length;i++){
        if(itemsinblock[i]==memeHash){
          console.warn('%c File already in Blockchain', 'background: #222; color: red')
          alert(' File already in Blockchain');
          flag = 1;
        }
      }
      if(flag==0){
        console.log('Adding file to Blockchain') 
        const content="abc123"
        this.createPost(content) 
        itemsinblock.push(memeHash);
        console.log('Elements in Blockchain')
        for(var j=0;j<itemsinblock.length;j++){
          console.log('Element ',j ,':',itemsinblock[j])
        }
      }        
      if(error) {
        console.error(error)
        return
      }
    })
  }



  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <p>&nbsp;</p>
        <p>&nbsp;</p>
        <div align="center">
          <form onSubmit={this.onSubmit} >
            <input type='file' className="btn btn-info" onChange={this.captureFile}  />
            <p>&nbsp;</p>
            <input type='submit' className="btn btn-success" />
          </form>
        </div>
      </div>
    );
  }
}

export default App;
