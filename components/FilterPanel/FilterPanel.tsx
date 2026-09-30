import { TaskStatus } from "@/types/task";
import styles from "./FilterPanel.module.less";

interface FilterPanelProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    assigneeQuery: string;
    onAssigneeChange: (value: string) => void;
    statusFilter: TaskStatus | "Все";
    onStatusChange: (value: TaskStatus | "Все") => void;
    sortOrder: "newest" | "oldest";
    onSortChange: (value: "newest" | "oldest") => void;
    disabled: boolean;
}

export default function FilterPanel({
    searchQuery,
    onSearchChange,
    assigneeQuery,
    onAssigneeChange,
    statusFilter,
    onStatusChange,
    sortOrder,
    onSortChange,
    disabled,
}: FilterPanelProps) {
    return (
        <div className={styles.controls}>
            <div className={styles.filterGroup}>
                <label htmlFor="search-input">Поиск по названию:</label>
                <input
                    id="search-input"
                    type="text"
                    placeholder="Введите название задачи..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    disabled={disabled}
                />
            </div>

            <div className={styles.filterGroup}>
                <label htmlFor="assignee-input">Поиск по исполнителю:</label>
                <input
                    id="assignee-input"
                    type="text"
                    placeholder="Введите имя исполнителя..."
                    value={assigneeQuery}
                    onChange={(e) => onAssigneeChange(e.target.value)}
                    disabled={disabled}
                />
            </div>

            <div className={styles.filterGroup}>
                <label htmlFor="status-filter">Статус:</label>
                <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => onStatusChange(e.target.value as TaskStatus | "Все")}
                    disabled={disabled}
                >
                    <option value="Все">Все</option>
                    <option value="Новая">Новая</option>
                    <option value="В работе">В работе</option>
                    <option value="Выполнена">Выполнена</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <label htmlFor="sort-order">Сортировка:</label>
                <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
                    disabled={disabled}
                >
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                </select>
            </div>
        </div>
    );
}