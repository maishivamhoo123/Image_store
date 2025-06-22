import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CameraCapture from './Camera/Camera'
import LatestImage from './assets/Frontend/FrontendImage'

function App() {
  const [count, setCount] = useState(0)

  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<CameraCapture />} />
        <Route path="/latest" element={<LatestImage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
