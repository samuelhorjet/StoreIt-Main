
const Hero = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 gradient-bg">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6">
              Navigating the world
              <br />
              of blockchain
            </h1>
            <p className="text-gray-300 mb-8 max-w-lg">
              Smart digital assets, trust, security, and efficiency are now a
              reality with blockchain technology. The game changer.
            </p>
            
          </div>
          <div className="w-full md:w-1/2 relative">
            {/* Abstract blockchain visualization placeholder */}
            <div className="w-full h-[400px] rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-secondary/20"></div>
              <div className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full bg-primary/30"></div>
              <div className="absolute bottom-1/3 left-1/3 w-32 h-32 rounded-full bg-secondary/30"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-primary/20"></div>

              {/* Feature circles */}
              <div className="absolute top-[10%] right-[10%] w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-xs">Service & Info</span>
              </div>
              <div className="absolute top-[20%] right-[30%] w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-xs">Trustworthy</span>
              </div>
              <div className="absolute bottom-[30%] right-[20%] w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-xs">Trusted</span>
              </div>
              <div className="absolute bottom-[15%] right-[40%] w-16 h-16 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-xs">Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
