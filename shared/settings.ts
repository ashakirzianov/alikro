import { useCallback, useEffect, useState } from "react"

export function useShowEditButton() {
    return useBooleanSetting('showEditButton')
}

export function useIsClient() {
    const [isClient, setIsClient] = useState(false)
    useEffect(() => {
        setIsClient(true)
    }, [])
    return isClient
}

function useBooleanSetting(key: string) {
    const [value, setValueState] = useState(getSetting(key) === 'true')
    const setValue = useCallback(function setValue(value: boolean) {
        setSetting(key, value ? 'true' : 'false')
        setValueState(value)
    }, [key])
    return [value, setValue] as const
}

function getSetting(key: string) {
    if (!isClient()) {
        return undefined
    }
    // get from local storage
    const value = localStorage.getItem(key)
    return value ?? undefined
}

function setSetting(key: string, value: string) {
    if (!isClient()) {
        return
    }
    localStorage.setItem(key, value)
}

function isClient() {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
}