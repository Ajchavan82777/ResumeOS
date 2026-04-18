"use client";
import { createContext, useContext, useRef, useEffect, useCallback, type CSSProperties, type ReactNode } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

interface EditCtx {
  editable: boolean;
  onSectionData: (sectionId: string, data: Record<string, any>) => void;
  onEntryData: (sectionId: string, entryId: string, data: Record<string, any>) => void;
  onSectionTitle: (sectionId: string, title: string) => void;
}

const EditContext = createContext<EditCtx>({
  editable: false,
  onSectionData: () => {},
  onEntryData: () => {},
  onSectionTitle: () => {},
});

export function EditProvider({
  children,
  onSectionData,
  onEntryData,
  onSectionTitle,
}: {
  children: ReactNode;
  onSectionData: (sectionId: string, data: Record<string, any>) => void;
  onEntryData: (sectionId: string, entryId: string, data: Record<string, any>) => void;
  onSectionTitle: (sectionId: string, title: string) => void;
}) {
  return (
    <EditContext.Provider value={{ editable: true, onSectionData, onEntryData, onSectionTitle }}>
      {children}
    </EditContext.Provider>
  );
}

export function useEditContext() {
  return useContext(EditContext);
}

// ─── InlineEditable component ─────────────────────────────────────────────────

interface InlineEditableProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: CSSProperties;
  className?: string;
  multiline?: boolean;
  tag?: "span" | "div" | "h1" | "h2" | "h3" | "p";
}

export function InlineEditable({
  value,
  onChange,
  placeholder = "Click to edit",
  style,
  className = "",
  multiline = false,
  tag: Tag = "span",
}: InlineEditableProps) {
  const { editable } = useEditContext();
  const ref = useRef<HTMLElement>(null);
  const isEditing = useRef(false);

  // Sync store value → DOM only when not actively editing
  useEffect(() => {
    if (ref.current && !isEditing.current) {
      if (ref.current.textContent !== (value || "")) {
        ref.current.textContent = value || "";
      }
    }
  }, [value]);

  // On mount, set initial content
  const setRef = useCallback((el: HTMLElement | null) => {
    (ref as any).current = el;
    if (el) el.textContent = value || "";
  }, []); // eslint-disable-line

  if (!editable) {
    return <Tag style={style} className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={setRef as any}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={!value ? placeholder : undefined}
      style={{
        outline: "none",
        cursor: "text",
        minWidth: 4,
        display: Tag === "span" ? "inline-block" : undefined,
        ...style,
      }}
      className={[
        "rounded transition-all duration-100",
        "hover:ring-1 hover:ring-blue-400 hover:ring-offset-1",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:bg-blue-50/30",
        !value ? "empty-field" : "",
        className,
      ].join(" ")}
      onFocus={() => { isEditing.current = true; }}
      onBlur={(e) => {
        isEditing.current = false;
        const newVal = (e.currentTarget as HTMLElement).textContent?.trim() ?? "";
        if (newVal !== (value ?? "")) onChange(newVal);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        // Escape cancels edit
        if (e.key === "Escape") {
          isEditing.current = false;
          if (ref.current) ref.current.textContent = value || "";
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    />
  );
}

// ─── Convenience wrappers ──────────────────────────────────────────────────────

/** Editable field bound to a section's data object */
export function SectionField({
  section,
  field,
  placeholder,
  style,
  className,
  tag,
  multiline,
}: {
  section: { id: string; data: Record<string, any> };
  field: string;
  placeholder?: string;
  style?: CSSProperties;
  className?: string;
  tag?: InlineEditableProps["tag"];
  multiline?: boolean;
}) {
  const { editable, onSectionData } = useEditContext();
  const Tag = tag || "span";
  const value = String(section.data[field] ?? "");
  if (!editable) return <Tag style={style} className={className}>{value}</Tag>;
  return (
    <InlineEditable
      value={value}
      onChange={(v) => onSectionData(section.id, { ...section.data, [field]: v })}
      placeholder={placeholder}
      style={style}
      className={className}
      tag={tag}
      multiline={multiline}
    />
  );
}

/** Editable field bound to an entry's data object */
export function EntryField({
  sectionId,
  entry,
  field,
  placeholder,
  style,
  className,
  tag,
  multiline,
}: {
  sectionId: string;
  entry: { id: string; data: Record<string, any> };
  field: string;
  placeholder?: string;
  style?: CSSProperties;
  className?: string;
  tag?: InlineEditableProps["tag"];
  multiline?: boolean;
}) {
  const { editable, onEntryData } = useEditContext();
  const Tag = tag || "span";
  const value = String(entry.data[field] ?? "");
  if (!editable) return <Tag style={style} className={className}>{value}</Tag>;
  return (
    <InlineEditable
      value={value}
      onChange={(v) => onEntryData(sectionId, entry.id, { ...entry.data, [field]: v })}
      placeholder={placeholder}
      style={style}
      className={className}
      tag={tag}
      multiline={multiline}
    />
  );
}

/** Editable section title */
export function SectionTitle({
  section,
  style,
  className,
}: {
  section: { id: string; title: string };
  style?: CSSProperties;
  className?: string;
}) {
  const { editable, onSectionTitle } = useEditContext();
  if (!editable) return <span style={style} className={className}>{section.title}</span>;
  return (
    <InlineEditable
      value={section.title}
      onChange={(v) => onSectionTitle(section.id, v || section.title)}
      placeholder="Section Title"
      style={style}
      className={className}
      tag="span"
    />
  );
}

/** Editable bullet item within an entry */
export function EntryBullet({
  sectionId,
  entry,
  index,
  value,
  style,
}: {
  sectionId: string;
  entry: { id: string; data: Record<string, any> };
  index: number;
  value: string;
  style?: CSSProperties;
}) {
  const { editable, onEntryData } = useEditContext();
  if (!editable) return <span style={style}>{value}</span>;
  return (
    <InlineEditable
      value={value}
      onChange={(v) => {
        const bullets = [...(entry.data.bullets || [])];
        bullets[index] = v;
        onEntryData(sectionId, entry.id, { ...entry.data, bullets });
      }}
      placeholder="Bullet point…"
      style={{ display: "block", ...style }}
      tag="span"
      multiline={false}
    />
  );
}
