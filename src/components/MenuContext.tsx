import { createContext, useContext } from 'react'

export type ModalName = 'portraits' | 'artworks' | 'contact'

export type CaseInfo = { index: number; total: number; title: string }

export type MenuState = {
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  modal: ModalName | null
  setModal: (v: ModalName | null) => void
  caseInfo: CaseInfo
  setCaseInfo: (v: CaseInfo) => void
}

export const MenuContext = createContext<MenuState | null>(null)

export function useMenu(): MenuState {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within <MenuContext.Provider>')
  return ctx
}
