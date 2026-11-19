#!/usr/bin/env ruby
# Adds a build flavor to the example app's iOS project: Debug-<flavor> and Release-<flavor> configurations copied
# from Debug and Release, and a <flavor> scheme copied from IaSdkReactNativeExample. Debug and Release, and the
# IaSdkReactNativeExample scheme, stay the demo app. Run it again for an existing flavor after changing Debug or Release:
# it copies the flavor's configurations afresh.
#
# Every flavor keeps the app's bundle ID and signing, which the access key is bound to, so it's delivered like the
# demo, with no further App IDs or provisioning profiles. Only the display name differs.
#
# Usage:
#   ruby scripts/add-example-ios-flavor.rb <flavor> <display name>
#   ruby scripts/add-example-ios-flavor.rb showcase 'Rx Showcase'
#
# Uses the xcodeproj gem, which comes with CocoaPods. Run `bundle exec pod install` in example/ios afterwards. The
# flavor also needs an Android product flavor and a component in example/index.js, see example/README.md.

require 'xcodeproj'

flavor, display_name = ARGV
abort 'Usage: ruby scripts/add-example-ios-flavor.rb <flavor> <display name>' unless display_name

ios_dir = File.expand_path('../example/ios', __dir__)
project = Xcodeproj::Project.open(File.join(ios_dir, 'IaSdkReactNativeExample.xcodeproj'))
app = project.targets.find { |target| target.name == 'IaSdkReactNativeExample' }
configuration_lists = [project.build_configuration_list] + project.targets.map(&:build_configuration_list)

%w[Debug Release].each do |mode|
  # The demo's own configurations, which name the component it launches (example/index.js).
  app.build_configuration_list[mode].build_settings['IA_FLAVOR'] ||= 'demo'

  name = "#{mode}-#{flavor}"
  configuration_lists.each do |list|
    if (existing = list[name])
      list.build_configurations.delete(existing)
      existing.remove_from_project
    end

    base = list[mode]
    configuration = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
    configuration.name = name
    configuration.base_configuration_reference = base.base_configuration_reference
    configuration.build_settings = Marshal.load(Marshal.dump(base.build_settings))
    list.build_configurations << configuration
  end

  settings = app.build_configuration_list[name].build_settings
  settings['IA_FLAVOR'] = flavor
  settings['IA_DISPLAY_NAME'] = display_name
end
project.save

schemes_dir = File.join(ios_dir, 'IaSdkReactNativeExample.xcodeproj', 'xcshareddata', 'xcschemes')
scheme = File.read(File.join(schemes_dir, 'IaSdkReactNativeExample.xcscheme'))
  .gsub(/buildConfiguration = "(Debug|Release)"/) { %(buildConfiguration = "#{Regexp.last_match(1)}-#{flavor}") }
File.write(File.join(schemes_dir, "#{flavor}.xcscheme"), scheme)

puts "Set up the #{flavor} flavor: Debug-#{flavor}, Release-#{flavor}, scheme #{flavor}"
