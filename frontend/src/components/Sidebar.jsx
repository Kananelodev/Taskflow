import React, { useState } from 'react'

const LABEL_COLORS = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#be4bdb', '#ff922b', '#a8e063', '#20c997']

export default function Sidebar({
    user, onLogout, filter, onFilter, tasks, labels,
    onAddLabel, onDeleteLabel, selectedLabel, onSelectLabel,
    isOpen, onClose,
}) {
    const [addingLabel, setAddingLabel] = useState(false)
    const [newLabelName, setNewLabelName] = useState('')
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0])
    const todayStr = new Date().toISOString().split('T')[0]

    const counts = {
        all: tasks.length,
        today: tasks.filter(t => t.date === todayStr).length,
        pending: tasks.filter(t => !t.done).length,
        done: tasks.filter(t => t.done).length,
    }

    const handleAddLabel = async () => {
        if (!newLabelName.trim()) return
        await onAddLabel({ name: newLabelName.trim(), color: newLabelColor })
        setNewLabelName('')
        setAddingLabel(false)
    }

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">✓</div>
                    <span className="sidebar-title">TaskFlow</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-title">Tasks</div>
                    {[
                        { key: 'All', icon: '📋', count: counts.all },
                        { key: 'Today', icon: '📅', count: counts.today },
                        { key: 'Pending', icon: '⏳', count: counts.pending },
                        { key: 'Done', icon: '✅', count: counts.done },
                    ].map(item => (
                        <button
                            key={item.key}
                            className={`nav-item ${filter === item.key && !selectedLabel ? 'active' : ''}`}
                            onClick={() => { onFilter(item.key); onSelectLabel(null); onClose() }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.key}
                            <span className="nav-count">{item.count}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-labels">
                    <div className="nav-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Labels
                        <button
                            onClick={() => setAddingLabel(!addingLabel)}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                                fontSize: 16, padding: '0 4px', transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
                        >
                            +
                        </button>
                    </div>

                    {addingLabel && (
                        <div className="add-label-row">
                            <input
                                className="add-label-input"
                                value={newLabelName}
                                onChange={e => setNewLabelName(e.target.value)}
                                placeholder="Label name"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleAddLabel(); if (e.key === 'Escape') setAddingLabel(false) }}
                            />
                            <div className="color-picker-mini">
                                {LABEL_COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`color-dot-btn ${newLabelColor === c ? 'active' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setNewLabelColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {labels.map(l => (
                        <button
                            key={l.id}
                            className={`label-item ${selectedLabel === l.id ? 'active' : ''}`}
                            onClick={() => { onSelectLabel(selectedLabel === l.id ? null : l.id); onClose() }}
                            style={selectedLabel === l.id ? { background: 'var(--surface2)', color: 'var(--text)' } : {}}
                        >
                            <span className="label-dot" style={{ background: l.color }} />
                            {l.name}
                        </button>
                    ))}

                    {labels.length === 0 && !addingLabel && (
                        <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 12px' }}>
                            No labels yet
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    <div className="user-info">
                        {user?.picture && <img src={user.picture} alt="" className="user-avatar" />}
                        <div>
                            <div className="user-name">{user?.given_name || user?.name}</div>
                            <div className="user-email">{user?.email}</div>
                        </div>
                        <button className="btn-signout" onClick={onLogout}>Sign out</button>
                    </div>
                </div>
            </aside>
        </>
    )
}
