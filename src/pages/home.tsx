import { AudioPlayer } from "@/components/audio/AudioPlayer"

const Home = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
            <AudioPlayer />
        </div>
    )
}

export default Home;