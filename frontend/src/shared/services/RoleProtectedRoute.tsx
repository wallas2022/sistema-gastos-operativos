import type { ReactNode } from 'react';
import { ForbiddenPage } from '../../pages/error/ForbiddenPage';
import { readUser } from '../../navigation/navigation';
export function RoleProtectedRoute({roles,children}:{roles:string[];children:ReactNode}){return roles.includes(readUser().role)?children:<ForbiddenPage/>}
