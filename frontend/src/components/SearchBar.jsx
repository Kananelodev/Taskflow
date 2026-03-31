import React, { useRef, useEffect } from 'react'

export default function SearchBar({ value, onChange }) {
    const inputRef = useRef(null)

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault()
                inputRef.current?.focus()
            }
            if (e.key === 'Escape' && document.activeElement === inputRef.current) {
                inputRef.current.blur()
                onChange('')
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onChange])

    return (
        <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Search tasks..."
                value={value}
                onChange={e => onChange(e.target.value)}
            />
            {!value && <span className="search-shortcut">/</span>}
        </div>
    )
}
