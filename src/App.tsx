import { RouterProvider, useRouter } from './router'
import Layout from './components/Layout'
import Home from './pages/Home'
import MergePDF from './pages/MergePDF'
import SplitPDF from './pages/SplitPDF'
import CompressPDF from './pages/CompressPDF'
import PDFtoWord from './pages/PDFtoWord'
import PDFtoJPG from './pages/PDFtoJPG'
import RotatePDF from './pages/RotatePDF'
import ProtectPDF from './pages/ProtectPDF'
import UnlockPDF from './pages/UnlockPDF'
import EditPDF from './pages/EditPDF'
import SignPDF from './pages/SignPDF'

const ROUTES: Record<string, React.ComponentType> = {
  '/': Home,
  '/merge': MergePDF,
  '/split': SplitPDF,
  '/compress': CompressPDF,
  '/edit': EditPDF,
  '/sign': SignPDF,
  '/word': PDFtoWord,
  '/jpg': PDFtoJPG,
  '/rotate': RotatePDF,
  '/protect': ProtectPDF,
  '/unlock': UnlockPDF,
}

function Routes() {
  const { path } = useRouter()
  const Page = ROUTES[path] ?? Home
  return (
    <Layout>
      <Page />
    </Layout>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
