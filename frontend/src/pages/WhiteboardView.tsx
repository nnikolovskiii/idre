import React from 'react';
import { HardHat } from 'lucide-react';

// We are not importing the Whiteboard component for now
// import Whiteboard from '../components/whiteboard/Whiteboard';

const WhiteboardView: React.FC = () => {
    // --- Start of Under Construction Disclaimer ---
    // This block displays a message instead of the actual whiteboard.
    // When the feature is complete, you can delete this return statement
    // and uncomment the original one below.
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-center p-4">
            <HardHat className="h-16 w-16 text-muted-foreground" />
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                Feature Under Construction
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                The Whiteboard is currently being developed and is not yet functional.
            </p>
            <p className="text-muted-foreground">
                We're working hard to bring this feature to you soon. Please check back later!
            </p>
        </div>
    );
    // --- End of Under Construction Disclaimer ---


    /*
    // Original code - uncomment this when the feature is ready
    return (
      <div className="h-screen w-full">
        <Whiteboard />
      </div>
    );
    */
};

export default WhiteboardView;