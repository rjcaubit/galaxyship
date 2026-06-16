import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

// StrictMode é deliberadamente omitido: o duplo mount/unmount em dev recria o
// contexto WebGL do canvas Pixi e quebra a renderização do mapa. Produção nunca
// faz double-invoke; em dev abrimos mão dessa checagem para o canvas funcionar.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
