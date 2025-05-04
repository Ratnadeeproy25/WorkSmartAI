import { NavItem } from '../components/shared/Sidebar';

export const employeeNavItems: NavItem[] = [
  {
    path: '/employee/dashboard',
    label: 'Dashboard',
    icon: 'bi-grid'
  },
  {
    path: '/employee/attendance',
    label: 'Attendance',
    icon: 'bi-calendar-check'
  },
  {
    path: '/employee/tasks',
    label: 'Task Management',
    icon: 'bi-list-task'
  },
  {
    path: '/employee/leave',
    label: 'Leave & Reimbursement',
    icon: 'bi-calendar2-check'
  },
  {
    path: '/employee/wellbeing',
    label: 'Wellbeing',
    icon: 'bi-heart-pulse'
  }
];

export const managerNavItems: NavItem[] = [
  {
    path: '/manager/dashboard',
    label: 'Dashboard',
    icon: 'bi-grid'
  },
  {
    path: '/manager/attendance',
    label: 'Attendance',
    icon: 'bi-calendar-check'
  },
  {
    path: '/manager/tasks',
    label: 'Task Management',
    icon: 'bi-list-task'
  },
  {
    path: '/manager/leave',
    label: 'Leave Management',
    icon: 'bi-calendar2-check'
  },
  {
    path: '/manager/employee-data',
    label: 'Employee Data',
    icon: 'bi-people'
  },
  {
    path: '/manager/wellbeing',
    label: 'Team Wellbeing',
    icon: 'bi-heart-pulse'
  }
];

export const adminNavItems: NavItem[] = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: 'bi-grid'
  },
  {
    path: '/admin/employee-management',
    label: 'Employees',
    icon: 'bi-people'
  },
  {
    path: '/admin/manager-management',
    label: 'Managers',
    icon: 'bi-person-badge'
  },
  {
    path: '/admin/attendance-management',
    label: 'Attendance',
    icon: 'bi-calendar-check'
  },
  {
    path: '/admin/leave-reimbursement',
    label: 'Leave & Reimbursement',
    icon: 'bi-calendar2-check'
  },
  {
    path: '/admin/wellbeing',
    label: 'Wellbeing',
    icon: 'bi-heart-pulse'
  }
]; 