import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav>
      <Link to='/'>Home</Link>
      <Link to='/login'>Login</Link>
      <Link to='/register'>Register</Link>
      <Link to='/dashboardpreseason'>Dashboard</Link>
      <Link to='/displayplayers'>Season 48 Players</Link>
    </nav>
  )
}
