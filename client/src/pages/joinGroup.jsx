import { useState, useContext, useEffect } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"
import { Link } from "react-router-dom"
import { UserContext } from "../../context/userContext";

export default function JoinGroup() {
    const { user, setUser, loading } = useContext(UserContext)

    useEffect(() => {
        if(loading || !user) return;
        console.log(user)
    }, [loading, user])

    if (!user) {
        return <p>Loading user...</p>
    }

    if(loading) {
        return (
            <p>
                loading
            </p>
        )
    }

    if (!loading && user.isGuest) {
        return (
            <div>
                <p>
                    To join group you must {" "}
                    <Link to="/register" className ="text-accent underline">
                        sign up
                    </Link> 
                    , or if you already have an account, you can{" "}
                    <Link to="/login" className="text-accent underline">
                        login
                    </Link>
                </p>
            </div>
        )
    }

    
    return (
        <h1 className="font-heading text-4xl lg:text-5xl tracking-tight">
            {user
            ? user.isGuest
                ? ""
                : <>Welcome, <span className="text-accent">{user.name}</span>!</>
            : "Welcome to the site!"}
        </h1>
    )
    
}