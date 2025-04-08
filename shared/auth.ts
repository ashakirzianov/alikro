'use server'
import { cookies } from "next/headers"

export async function isAuthenticated() {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth')
    if (authCookie) {
        return validateAuthToken(authCookie.value)
    }
    return false
}

export async function authenticate(password: string) {
    if (validatePassword(password)) {
        const cookieStore = await cookies()
        const value = generateAuthToken()
        cookieStore.set({
            name: 'auth',
            value,
            httpOnly: true,
        })
    }

}

function validatePassword(password: string) {
    return password === 'nope'
}

function validateAuthToken(cookie: string) {
    return cookie === 'alikro'
}

function generateAuthToken() {
    return 'alikro'
}