import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DocumentPage from './pages/DocumentPage'
import AboutPage from './pages/AboutPage'
import './styles/global.css'

export default function App() {
  var [currentDoc, setCurrentDoc] = useState(null)

  function handleViewDocument(docId) {
    setCurrentDoc(docId)
    window.scrollTo(0, 0)
  }

  function handleBack() {
    setCurrentDoc(null)
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                currentDoc
                  ? <DocumentPage documentId={currentDoc} onBack={handleBack} />
                  : <HomePage onViewDocument={handleViewDocument} />
              }
            />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
