'use client';

import DrawerLayout from './DrawerLayout';

export default function DrawerWrapper({ children }: { children: React.ReactNode }) {
  return <DrawerLayout>{children}</DrawerLayout>;
}