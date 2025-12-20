import React from "react";
import WelcomeHeader from "@/components/home/welcome.header";
import EventSessionsFeed from "@/components/home/event.session.feed";

export default function HomeScreen() {
    return (
        <>
            <WelcomeHeader />
            <EventSessionsFeed />
        </>
    );
}
