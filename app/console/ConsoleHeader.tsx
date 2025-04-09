import { NavigationLink } from "@/shared/Atoms"
import { hrefForConsole } from "@/shared/href"

export default function ConsoleHeader({
    kinds, tags, selectedSection, selectedAction,
}: {
    kinds: string[],
    tags: string[],
    selectedSection: string,
    selectedAction: string | undefined,
}) {
    const sections = ['all', ...kinds, ...tags]
    return (
        <nav className="flex flex-row flex-wrap text-accent text-2xl sm:text-5xl whitespace-nowrap pb-2">
            <NavigationLink
                href="/"
                title="Alikro"
                last
            />{'//'}&nbsp;

            {sections.map((section, index) => (
                <NavigationLink
                    key={section}
                    href={hrefForConsole(section)}
                    title={section}
                    selected={selectedSection === section}
                    last={index === sections.length - 1}
                />
            ))}
            &nbsp;//&nbsp;
            <NavigationLink
                href={hrefForConsole(selectedSection, 'upload')}
                title="Upload"
                selected={selectedAction === 'upload'}
                last
            />
            &nbsp;//&nbsp;
            <NavigationLink
                href={hrefForConsole(selectedSection, 'json')}
                title="Json"
                selected={selectedAction === 'json'}
                last
            />
        </nav>
    )
}