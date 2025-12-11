require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

env = {}
env_file = File.join(__dir__, ".env")

if File.exist?(env_file)
  File.readlines(env_file).each do |line|
    line = line.strip
    next if line == "" || line.start_with?("#")
    key, value = line.split("=", 2)
    env[key] = value.gsub(/"/, "")
  end
else
  raise "Missing .env file at #{env_file}"
end

appSdkVersionId = env["IOS_APPSDK_VERSION"]
raise "No IOS_APPSDK_VERSION provided from .env file." if appSdkVersionId.nil? || appSdkVersionId.strip.empty?

Pod::Spec.new do |s|
  s.name         = "IaSdkReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/ihreapotheken/ia-sdk-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)

  if defined?(:spm_dependency)
    spm_dependency(s,  
      url: 'https://github.com/ihreapotheken/IA-SDK-iOS', 
      requirement: {kind: 'exact', version: appSdkVersionId}, 
      products: ['IAOverTheCounter', 'IAOrdering', 'IAPharmacy', 'IAIntegrations', 'IACardLink', 'IAPrescription'] 
    ) 
  else 
    raise "Please upgrade React Native to >=0.75.0 to use SPM dependencies." 
  end 
end
