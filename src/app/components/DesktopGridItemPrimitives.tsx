import React, { useState, useRef, useEffect } from "react";
import { FaviconIcon } from "./shared/FaviconIcon";
import { useDismissOnPointerDownOutside } from "./useDismissOnPointerDownOutside";

export function Favicon({
  domain,
  name,
  size = 44,
  iconClassName = "",
}: {
  domain: string;
  name: string;
  size?: number;
  /** 追加在 FaviconIcon 上（如反色 `brightness-0 invert`）。 */
  iconClassName?: string;
}) {
  return (
    <FaviconIcon
      domain={domain}
      name={name}
      size={size}
      className={`object-contain drop-shadow-sm ${iconClassName}`.trim()}
      style={{ borderRadius: size * 0.2 }}
    />
  );
}

export function EditableLabel({
  initialName,
  onRename,
  showLabels = true,
  className = "",
  inputClassName = "",
  style = {},
  inputStyle = {},
  autoWidth = false,
}: {
  initialName: string;
  onRename: (newName: string) => void;
  showLabels?: boolean;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  autoWidth?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editingRootRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      savedRef.current = false;
    }
  }, [isEditing]);

  const handleSave = () => {
    if (savedRef.current) return;
    savedRef.current = true;
    setIsEditing(false);
    if (value.trim() !== "" && value.trim() !== initialName) {
      onRename(value.trim());
    }
  };
  const handleCancel = () => {
    savedRef.current = true;
    setIsEditing(false);
    setValue("");
  };

  useDismissOnPointerDownOutside(editingRootRef, isEditing, handleCancel);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!showLabels && !isEditing) return null;

  if (isEditing) {
    if (autoWidth) {
      return (
        <div ref={editingRootRef} className="relative inline-flex items-center justify-center min-w-[40px] max-w-full">
          <span
            className={`${inputClassName} pointer-events-none whitespace-pre`}
            style={{
              ...inputStyle,
              visibility: "hidden",
              color: "transparent",
              position: "relative",
              zIndex: -1,
            }}
          >
            {value || initialName}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={initialName}
            maxLength={15}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              outline: "none",
              border: "none",
              ...inputStyle,
            }}
            className={`focus:ring-0 ${inputClassName}`}
          />
        </div>
      );
    }

    return (
      <div ref={editingRootRef} className="inline-flex max-w-full">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={initialName}
          maxLength={15}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: "transparent",
            outline: "none",
            border: "none",
            ...({ fieldSizing: "content" } as React.CSSProperties & { fieldSizing?: string }),
            ...inputStyle,
          }}
          className={`focus:ring-0 ${inputClassName}`}
        />
      </div>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setValue("");
        setIsEditing(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "text",
        pointerEvents: "auto",
        ...style,
      }}
      className={className}
    >
      {initialName}
    </span>
  );
}
