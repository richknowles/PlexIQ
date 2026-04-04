"""
PlexIQ v3 Setup Script
Author: Rich Knowles (via Claude-Code)
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding='utf-8') if readme_file.exists() else ""

# Core requirements (no GUI)
GUI_PACKAGES = {'PyQt6', 'PyQt6-Qt6', 'PyQt6-WebEngine'}

requirements_file = Path(__file__).parent / "requirements.txt"
core_requirements = []
gui_requirements = []
if requirements_file.exists():
    for line in requirements_file.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        pkg_name = line.split('>=')[0].split('==')[0].split('[')[0].strip()
        if pkg_name in GUI_PACKAGES:
            gui_requirements.append(line)
        else:
            core_requirements.append(line)

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
    install_requires=core_requirements,
    extras_require={
        'gui': gui_requirements,
    },
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
