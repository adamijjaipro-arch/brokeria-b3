from setuptools import setup, find_packages

setup(
    name="broker-ia-ai",
    version="1.0.0",
    description="AI module for Broker IA trading platform",
    author="Broker IA Team",
    author_email="team@brokerla.com",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
        "scipy>=1.11.0",
        "matplotlib>=3.7.0",
        "seaborn>=0.12.0",
        "plotly>=5.14.0",
        "ta-lib>=0.4.0",
        "requests>=2.31.0",
        "python-dotenv>=1.0.0",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
