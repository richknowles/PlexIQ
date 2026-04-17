"""
PlexIQ v3 Setup Script
Author: Rich Knowles (via Claude-Code)
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding='utf-8') if readme_file.exists() else ""

# Read requirements
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    requirements = [
        line.strip()
        for line in requirements_file.read_text(encoding='utf-8').splitlines()
        if line.strip() and not line.startswith('#')
    ]

setup(
    name='plexiq',
    version='3.0.0',
    author='Rich Knowles',
    author_email='',
    description='Smart Plex Media Library Management with Safety-First Design',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/richknowles/PlexIQ',
    packages=find_packages(exclude=['tests', 'docs', 'examples']),
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: End Users/Desktop',
        'Topic :: Multimedia :: Video',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
    ],
    python_requires='>=3.8',
    install_requires=requirements,
    entry_points={
        'console_scripts': [
            'plexiq=plexiq.cli:main',
        ],
    },
    include_package_data=True,
    package_data={
        'plexiq': [
            '*.md',
            'docs/*',
        ],
    },
    keywords='plex media library management automation',
    project_urls={
        'Bug Reports': 'https://github.com/richknowles/PlexIQ/issues',
        'Source': 'https://github.com/richknowles/PlexIQ',
    },
)
