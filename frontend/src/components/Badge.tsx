import React from 'react';

interface BadgeProps {
  type: 'status' | 'customerType' | 'movement' | 'role';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  const normalized = value.toLowerCase();

  let className = 'badge ';

  if (type === 'status') {
    if (['active', 'confirmed'].includes(normalized)) className += 'badge-active';
    else if (['lead', 'draft'].includes(normalized)) className += 'badge-lead';
    else if (['inactive', 'cancelled'].includes(normalized)) className += 'badge-inactive';
    else className += 'badge-role';
  } else if (type === 'customerType') {
    if (normalized === 'retail') className += 'badge-retail';
    else if (normalized === 'wholesale') className += 'badge-wholesale';
    else if (normalized === 'distributor') className += 'badge-distributor';
    else className += 'badge-role';
  } else if (type === 'movement') {
    className += normalized === 'in' ? 'badge-in' : 'badge-out';
  } else if (type === 'role') {
    className += 'badge-role';
  }

  return <span className={className}>{value}</span>;
};
