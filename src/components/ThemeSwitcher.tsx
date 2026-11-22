import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Landmark,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import styled from 'styled-components';
import type { ThemeMode, ThemeStyle } from '../hooks/useTheme';

const Wrap = styled.div`
  position: relative;
  flex: none;
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--cp-radius-pill);
  border: 1px solid var(--cp-line);
  background: var(--cp-surface);
  color: var(--cp-text);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  &:hover {
    border-color: var(--cp-accent);
  }
  svg {
    color: var(--cp-accent);
  }
  @media (max-width: 560px) {
    span {
      display: none;
    }
  }
`;

const Menu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 50;
  min-width: 220px;
  padding: 6px;
  border-radius: var(--cp-radius-md);
  border: 1px solid var(--cp-line);
  background: var(--cp-surface);
  box-shadow: var(--shadow, 0 8px 24px rgba(0, 0, 0, 0.3));
  animation: cp-rise 0.15s ease both;
`;

const MenuLabel = styled.div`
  padding: 8px 10px 4px;
  color: var(--cp-text-faint);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const MenuItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--cp-radius-sm);
  background: ${(props) =>
    props.$active ? 'var(--cp-accent-soft)' : 'transparent'};
  color: ${(props) =>
    props.$active ? 'var(--cp-accent-text)' : 'var(--cp-text)'};
  font-size: 0.9rem;
  font-weight: ${(props) => (props.$active ? 700 : 500)};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: var(--cp-raised);
  }
  svg {
    flex: none;
  }
`;

const CheckSlot = styled.span`
  margin-left: auto;
  display: inline-flex;
  color: var(--highlight, var(--cp-accent));
`;

const Divider = styled.div`
  height: 1px;
  margin: 6px 4px;
  background: var(--cp-line-faint);
`;

interface ThemeSwitcherProps {
  style: ThemeStyle;
  mode: ThemeMode;
  onStyle: (style: ThemeStyle) => void;
  onMode: (mode: ThemeMode) => void;
}

export function ThemeSwitcher({ style, mode, onStyle, onMode }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open ]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  function pickStyle(next: ThemeStyle) {
    onStyle(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function pickMode(next: ThemeMode) {
    onMode(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <Wrap ref={wrapRef} onKeyDown={onKeyDown}>
      <Trigger
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Theme settings"
        onClick={() => setOpen((prev) => !prev)}
      >
        {style === 'achaemenid' ? (
          <Landmark size={15} />
        ) : (
          <Sparkles size={15} />
        )}
        <span>{style === 'achaemenid' ? 'Achaemenid' : 'Modern'}</span>
        {mode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        <ChevronDown size={13} />
      </Trigger>
      {open && (
        <Menu role="menu" aria-label="Theme">
          <MenuLabel>Style</MenuLabel>
          <MenuItem
            role="menuitemradio"
            aria-checked={style === 'achaemenid'}
            $active={style === 'achaemenid'}
            onClick={() => pickStyle('achaemenid')}
          >
            <Landmark size={16} />
            Achaemenid
            {style === 'achaemenid' && (
              <CheckSlot>
                <Check size={15} strokeWidth={3} />
              </CheckSlot>
            )}
          </MenuItem>
          <MenuItem
            role="menuitemradio"
            aria-checked={style === 'modern'}
            $active={style === 'modern'}
            onClick={() => pickStyle('modern')}
          >
            <Sparkles size={16} />
            Modern
            {style === 'modern' && (
              <CheckSlot>
                <Check size={15} strokeWidth={3} />
              </CheckSlot>
            )}
          </MenuItem>
          <Divider />
          <MenuLabel>Mode</MenuLabel>
          <MenuItem
            role="menuitemradio"
            aria-checked={mode === 'light'}
            $active={mode === 'light'}
            onClick={() => pickMode('light')}
          >
            <Sun size={16} />
            Light
            {mode === 'light' && (
              <CheckSlot>
                <Check size={15} strokeWidth={3} />
              </CheckSlot>
            )}
          </MenuItem>
          <MenuItem
            role="menuitemradio"
            aria-checked={mode === 'dark'}
            $active={mode === 'dark'}
            onClick={() => pickMode('dark')}
          >
            <Moon size={16} />
            Dark
            {mode === 'dark' && (
              <CheckSlot>
                <Check size={15} strokeWidth={3} />
              </CheckSlot>
            )}
          </MenuItem>
        </Menu>
      )}
    </Wrap>
  );
}
