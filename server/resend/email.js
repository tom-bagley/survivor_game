const { resend } = require('./config')
const { verificationTokenEmailTemplate, welcomeEmail, resetPasswordLinkEmail, passwordResetSuccessfulEmail, joinGroupEmail } = require('./email-template')

const sendVerificationEmail = async (email, verificationToken) => {
    console.log(email, verificationToken)
    try {
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [email],
            subject: "Verify Your Email Address Now",
            html: verificationTokenEmailTemplate.replace("{verificationToken}", verificationToken),
        });
    } catch (error) {
        console.log("error sending verification email", error)
        throw new Error("Error sending verification email")
    }
}

const sendWelcomeEmail = async (email, name) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "Acme <onboarding@resend.dev>",
            to: [email],
            subject: "Welcome to the Survivor Stock Exchange",
            html: welcomeEmail.replace("{name}", name),
        });
    } catch (error) {
        console.log("error sending welcome email", error)
        throw new Error("Error sending welcome email")
    }
}

const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Survivor Stock Exchange <no-reply@mail.survivorstockexchange.com>',
            to: [email],
            subject: "Reset Your Password",
            html: resetPasswordLinkEmail.replace(/{resetURL}/g, resetURL)

        });
    } catch (error) {
        console.log("error sending password reset email", error)
        throw new Error("Error sending password reset email")
    }
}

const sendRestSuccessEmail = async (email) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "Survivor Stock Exchange <no-reply@mail.survivorstockexchange.com>",
            to: [email],
            subject: "Password Reset Was Successful",
            html: passwordResetSuccessfulEmail,
        });
    } catch (error) {
        console.log("error sending password reset successful email", error)
        throw new Error("Error sending password reset successful email email")
    }
}

const sendGroupInviteEmail = async (email, inviteURL) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Survivor Stock Exchange <no-reply@mail.survivorstockexchange.com>',
            to: [email],
            subject: "Invite to join",
            html: joinGroupEmail.replace(/{resetURL}/g, inviteURL)
        })
    } catch (error) {
        throw new Error("Error sending join group email")
    }
}

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendRestSuccessEmail,
    sendGroupInviteEmail
}