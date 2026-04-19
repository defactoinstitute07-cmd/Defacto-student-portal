import React from 'react';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-fast-shimmer rounded-[15px] ${className || ''}`}
            {...props}
        />
    );
};

export default Skeleton;
