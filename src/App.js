import React, { useEffect, useState } from 'react';
import Particles from 'react-particles-js';
import './App.css';
import Navigation from './components/Navigation';
import Logo from './components/Logo';
import ImageLinkForm from './components/ImageLinkForm';
import Rank from './components/Rank';
import Clarifai from 'clarifai';
import FaceRecognition from './components/FaceRecognition';
import SignIn from './components/SignIn';
import Register from './components/Register';

// console.log();


const App = () => {

  const app = new Clarifai.App({
    apiKey: '1a59fb1a42b04dd6a1292939181a7c7e'
   });

  const particlesOptions = {
    particles: {
      number: {
        value: 30,
        density: {
          enable: true,
          value_area: 800
        }
      }
    }
  }

  const [userInput, setUserInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [box, setBox] = useState({});
  const [route, setRoute] = useState('signin');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState({ id: '', name: '', email: '', entries: 0, joined: '' });

  const loadUser = (data) => {
    setUser({ id: data.id, name: data.name, email: data.email, entries: data.entries, joined: data.joined })
  }

  useEffect(() => {
    fetch('http://localhost:3000')
      .then(response => response.json())
      .then(data => console.log(data))
  }, [])

  const calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  const displayFaceBox = (box) => {
    setBox(box);
  }
 
  const onInputChange = (val) => {
    setUserInput(val);
  }

  const onButtonSubmit = () => {
    setImageUrl(userInput);
    app.models.predict( Clarifai.DEMOGRAPHICS_MODEL, userInput)
      .then(response => {
        if (response) {
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                id: user.id
            })
          })
          .then(response => response.json())
          .then(count => {
            setUser(prevState => ({...prevState, entries: count}))
          })
        }
        displayFaceBox(calculateFaceLocation(response))
      })
      .catch(err => console.log(err))
  }

  const onRouteChange = (route) => {
    if (route === 'signout') {
      setIsSignedIn(false)
    } else if (route === 'home') {
      setIsSignedIn(true);
    }
    setRoute(route);
  }


  return (
    <div className="App">
      <Particles className="particles" params={particlesOptions} />
      <Navigation isSignedIn={isSignedIn} onRouteChange={onRouteChange} />
      { route === 'home' 
        ? <div>
            <Logo />
            <Rank name={user.name} entries={user.entries} />
            <ImageLinkForm onInputChange={onInputChange} onButtonSubmit={onButtonSubmit} />
            <FaceRecognition box={box} imageUrl={imageUrl} />
          </div>
        : (
          route === 'signin'
          ? <SignIn onRouteChange={onRouteChange} loadUser={loadUser} />
          : <Register onRouteChange={onRouteChange} loadUser={loadUser} />
        ) 
      }
    </div>
  );
}

export default App;
