import React from 'react';
// Import all icon components from the barrel file into a single object
import * as icons from '../icons';

// Create a map from the string identifier (what you store in the DB)
// to the actual React component.
const iconMap = {
    'soccer-ball': icons.SoccerBallIcon,
    'book': icons.BookIcon,
    'rocket': icons.RocketIcon,
    'star': icons.StarIcon,
    'fingerprint': icons.FingerPrint,
    'palette': icons.PalleteIcon,
    'pet': icons.PetIcon,
    'shop': icons.ShopIcon,
};

// Create a TypeScript type for our icon names to ensure type safety.
export type IconName = keyof typeof iconMap;

// Define the props for our Icon component
interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
    // Look up the component in our map using the 'name' prop
    const IconComponent = iconMap[name];

    // If no component is found for the given name, render nothing.
    // This prevents errors if the data is invalid.
    if (!IconComponent) {
        return null;
    }

    // Render the found component, passing along any other props (like className, etc.)
    return <IconComponent {...props} />;
};
