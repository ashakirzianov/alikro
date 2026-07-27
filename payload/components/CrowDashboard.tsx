import type { WidgetServerProps } from 'payload'

// Re-skin (2026-07-27): Crow has no dashboard — signing in drops you straight
// into the wall of pictures, under a red comma-separated header. Payload's
// stock `/admin` is a grid of "Collections" cards, which is the most
// generic-CMS screen in the product.
//
// This is a dashboard *widget*, registered through `admin.dashboard.widgets`
// and placed by `admin.dashboard.defaultLayout` — a first-party API added in
// 3.x, not a CSS override. The stock `collections` widget is still registered
// (Payload pushes it in during config sanitization); it is simply not in the
// default layout any more, so a user who wants it back can add it from the
// dashboard's own widget picker.
export async function CrowDashboard({ req }: WidgetServerProps) {
    const recent = await req.payload.find({
        collection: 'artworks',
        limit: 12,
        sort: '-updatedAt',
        // Respect the signed-in user's access rather than overriding it, so the
        // number on screen is the number they can actually open.
        overrideAccess: false,
        req,
    })

    return (
        <div className="crow-dash">
            <nav className="crow-dash__nav">
                <a className="crow-dash__link" href="/admin/collections/artworks">artworks</a>,&nbsp;
                <a className="crow-dash__link" href="/admin/collections/artworks?limit=24&amp;where[_status][equals]=draft">drafts</a>,&nbsp;
                <a className="crow-dash__link" href="/admin/collections/users">users</a>
            </nav>
            <p className="crow-dash__count">{recent.totalDocs} assets in collection</p>
            {/* A dashboard with nothing but three words on it is not "like
                Crow" — Crow's equivalent screen is a wall of pictures. This is
                the last dozen touched, as a way in. */}
            <div className="crow-dash__recent">
                {recent.docs.map(doc => {
                    const thumbnail = doc.sizes?.w480?.url ?? doc.sizes?.w320?.url
                    return thumbnail && (
                        <a key={doc.id} href={`/admin/collections/artworks/${doc.id}`}>
                            <img src={thumbnail} alt={doc.title ?? ''} />
                        </a>
                    )
                })}
            </div>
        </div>
    )
}
