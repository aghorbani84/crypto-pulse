import { useState } from 'react';
import styled from 'styled-components';

/**
 * Coin icon with an honest fallback: if the CoinGecko image fails to load
 * (or the coin ships no image), render a themed initial tile — never a
 * broken <img>. All colors come from the active theme tokens.
 */
const Tile = styled.span<{ $size: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: 50%;
  border: 1px solid var(--cp-line);
  background: var(--cp-accent-soft);
  color: var(--cp-accent-text);
  font-size: ${(props) => Math.round(props.$size * 0.42)}px;
  font-weight: 700;
  font-family: var(--cp-display);
  flex: none;
  text-transform: uppercase;
`;

const Img = styled.img<{ $size: number }>`
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  border-radius: 50%;
  border: 1px solid var(--cp-line);
  flex: none;
`;

interface CoinIconProps {
  src: string | undefined;
  name: string;
  size?: number;
}

export function CoinIcon({ src, name, size = 28 }: CoinIconProps) {
  const [failed, setFailed] = useState(false);
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  if (!src || failed) {
    return (
      <Tile $size={size} aria-hidden="true">
        {initial}
      </Tile>
    );
  }
  return (
    <Img
      $size={size}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
