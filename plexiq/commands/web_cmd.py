"""Launch web interface command."""
import click

@click.command()
@click.option('--host', default='0.0.0.0', help='Host to bind to')
@click.option('--port', default=8080, help='Port to bind to')
@click.pass_context
def web(ctx, host, port):
    """Launch the PlexIQ web interface."""
    import uvicorn
    from plexiq.web.app import app
    click.echo(f"Starting PlexIQ web interface on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

