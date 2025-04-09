import { NavigationLink } from "@/shared/Atoms"
import { hrefForConsole } from "@/shared/href"

export default function ConsoleHeader({
    kinds, tags, selectedSection, selectedAction, shallow,
}: {
    kinds: string[],
    tags: string[],
    selectedSection: string,
    selectedAction: string | undefined,
    shallow?: boolean,
}) {
    const sections = ['all', ...kinds, ...tags]
    return (
        <nav className="flex flex-row flex-wrap text-accent text-2xl sm:text-5xl whitespace-nowrap pb-2">
            <NavigationLink
                href="/"
                title="Alikro"
                shallow={shallow}
                last
            />{'//'}&nbsp;

            {sections.map((section, index) => (
                <NavigationLink
                    key={section}
                    href={hrefForConsole({ section })}
                    title={section}
                    selected={selectedSection === section}
                    shallow={shallow}
                    last={index === sections.length - 1}
                />
            ))}
            &nbsp;//&nbsp;
            <NavigationLink
                href={hrefForConsole({
                    section: selectedSection,
                    action: 'upload',
                })}
                title="Upload"
                selected={selectedAction === 'upload'}
                shallow={shallow}
                last
            />
            &nbsp;//&nbsp;
            <NavigationLink
                href={hrefForConsole({
                    section: selectedSection,
                    action: 'json',
                })}
                title="Json"
                selected={selectedAction === 'json'}
                shallow={shallow}
                last
            />
        </nav>
    )
}