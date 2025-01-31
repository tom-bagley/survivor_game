import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav>
      <Link to='/'>Home</Link>
      <Link to='/login'>Login</Link>
      <Link to='/register'>Register</Link>
      <Link to='/players'>Season 48 Players</Link>
      <Link to='/dashboard'>Dashboard</Link>
      <Link to='/dashboardpreseason'>Preseason Dashboard</Link>
    </nav>
  )
}
