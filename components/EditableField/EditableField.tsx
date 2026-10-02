'use client';

import { useId, useState } from "react";
import styles from "./EditableField.module.less";

interface EditableFieldProps {
    label: string;
    value: string;
    emptyText?: string;
    options?: readonly string[];
    onSave: (value: string) => Promise<string | null>;
    disabled?: boolean;
}

export default function EditableField({
    label,
    value,
    emptyText,
    options,
    onSave,
    disabled = false,
}: EditableFieldProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState<string | null>(null);
    // Локальный флаг, а не только props.disabled: защита от двойного клика, пока родитель не перерендерился
    const [saving, setSaving] = useState(false);
    const fieldId = useId();

    const startEditing = () => {
        setDraft(value);
        setError(null);
        setEditing(true);
    };

    const save = async () => {
        if (saving) return;
        setSaving(true);
        setError(null);
        const errorText = await onSave(draft);
        setSaving(false);
        if (errorText === null) {
            setEditing(false);
        } else {
            setError(errorText);
        }
    };

    if (!editing) {
        return (
            <div className={styles.view}>
                {value ? (
                    <span className={styles.value}>{value}</span>
                ) : (
                    <span className={styles.empty}>{emptyText}</span>
                )}
                <button
                    type="button"
                    className={styles.editBtn}
                    onClick={startEditing}
                    disabled={disabled}
                    aria-label={label}
                >
                    Изменить
                </button>
            </div>
        );
    }

    return (
        <div className={styles.editor}>
            <label htmlFor={fieldId} className={styles.srOnly}>{label}</label>
            {options ? (
                <select
                    id={fieldId}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={disabled || saving}
                    autoFocus
                >
                    {options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : (
                <textarea
                    id={fieldId}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={disabled || saving}
                    autoFocus
                    rows={4}
                />
            )}
            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={() => void save()}
                    disabled={disabled || saving || draft === value}
                >
                    Сохранить
                </button>
                <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setEditing(false)}
                    disabled={saving}
                >
                    Отмена
                </button>
            </div>
            {error && (
                <div className={styles.actionError} role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        className={styles.retryBtn}
                        onClick={() => void save()}
                        disabled={disabled || saving}
                    >
                        Повторить
                    </button>
                </div>
            )}
        </div>
    );
}
