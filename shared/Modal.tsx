import { ReactNode } from "react"

export function Modal({ children, onDismiss }: {
    children: ReactNode,
    onDismiss?: () => void,
}) {
    // Show a modal with the children
    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}
            onClick={onDismiss}
        >
            {children}
        </div>
    )
}